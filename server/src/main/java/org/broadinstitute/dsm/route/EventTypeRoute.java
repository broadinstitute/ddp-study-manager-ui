package org.broadinstitute.dsm.route;

import org.apache.commons.lang3.StringUtils;
import org.broadinstitute.ddp.handlers.util.Result;
import org.broadinstitute.dsm.db.EventType;
import org.broadinstitute.dsm.security.RequestHandler;
import org.broadinstitute.dsm.statics.RequestParameter;
import org.broadinstitute.dsm.statics.UserErrorMessages;
import org.broadinstitute.dsm.util.UserUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import spark.Request;
import spark.Response;

public class EventTypeRoute extends RequestHandler {

    private static final Logger logger = LoggerFactory.getLogger(EventTypeRoute.class);

    @Override
    public Object processRequest(Request request, Response response, String userId, String userMail) throws Exception {
        String realm = request.params(RequestParameter.REALM);
        if (StringUtils.isNotBlank(realm)) {
            if (UserUtil.checkUserAccess(realm, userId, "participant_event")) {
                return EventType.getEventTypes(realm);
            }
            else {
                response.status(500);
                return new Result(500, UserErrorMessages.NO_RIGHTS);
            }
        }
        logger.error("Realm was missing");
        return new Result(500);
    }
}
